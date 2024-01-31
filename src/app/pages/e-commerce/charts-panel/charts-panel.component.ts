import { Component, OnDestroy, ViewChild ,OnInit} from '@angular/core';
import { takeWhile } from 'rxjs/operators';
import * as Highcharts from 'highcharts';
import { AfterViewInit } from '@angular/core';
import { OrdersChartComponent } from './charts/orders-chart.component';
import { ProfitChartComponent } from './charts/profit-chart.component';
import { OrdersChart } from '../../../@core/data/orders-chart';
import { ProfitChart } from '../../../@core/data/profit-chart';
import { OrderProfitChartSummary, OrdersProfitChartData } from '../../../@core/data/orders-profit-chart';
import { ChangeDetectorRef } from '@angular/core';
// import { jsonData } from '../../../../jsonData';
import { DataService } from './data.service';
 
 
@Component({
  selector: 'ngx-ecommerce-charts',
  styleUrls: ['./charts-panel.component.scss'],
  templateUrl: './charts-panel.component.html',
})
 
 
export class ECommerceChartsPanelComponent implements OnInit,OnDestroy,AfterViewInit {
 
  buttonCounts: { label: string; total: number }[] = [];
  private alive = true;
  dates: string[] = [];
  uniqueUsernames: string[] = [];
  // selectedUsername: string;
  chartPanelSummary: OrderProfitChartSummary[];
  period: string = 'week';
  allDates: string[] = [];
  ordersChartData: OrdersChart;
  profitChartData: ProfitChart;
  selectedUserIndex: number = 0;
  // buttonCounts: { label: string; total: number }[] = [];
  selectedScreenData: any;
  selectedUsername: string = '';
  screen1Data: any = {};
  screen2Data: any = {};
  screenLabels: string[] = [];
  selectedDate: string = '';
  selectedUserScreenData: any;
  selectedUserButtonTotals: { label: string; total: number }[] = [];
  selectedUserButtonTotalsScreen1: { label: string; total: number }[] = [];
  selectedUserButtonTotalsScreen2: { label: string; total: number }[] = [];
  userEventDates: string[] = [];
 
  @ViewChild('ordersChart', { static: true }) ordersChart: OrdersChartComponent;
  @ViewChild('profitChart', { static: true }) profitChart: ProfitChartComponent;
  // jsonData = jsonData;
  apiData: any[];
  constructor(private ordersProfitChartService: OrdersProfitChartData,private cdr: ChangeDetectorRef,private dataService: DataService) {
 
    this.selectedUsername = 'all';
   
    this.ordersProfitChartService.getOrderProfitChartSummary()
      .pipe(takeWhile(() => this.alive))
      .subscribe((summary) => {
        this.chartPanelSummary = summary;
      });
 
      this.extractUniqueUsernames();
 
    // this.getOrdersChartData(this.period);
    // this.getProfitChartData(this.period);
  }
 
  extractUniqueUsernames() {
    // Fetch unique usernames and dates from the API endpoint instead of jsonData
    this.dataService.getAllUsernamesAndDates().subscribe((userData: { username: string, dates: string[] }[]) => {
      this.uniqueUsernames = userData.map(user => user.username);
      // Initialize the dates array with the dates of the first user
      this.dates = userData[0]?.dates || [];
      // Set the selectedUsername to the first user
      this.selectedUsername = this.uniqueUsernames[0];
    });
  }
 
 
  ngOnInit() {
    this.extractUniqueUsernames();
    // if (this.selectedUsername === 'all') {
    //   this.getData();
    // }
    this.extractScreenLabels();
    this.getData();
    // this.onDateSelected(this.allDates[0]);
  }
 
  ngAfterViewInit() {
    // this.processJsonData();
    this.getOrdersChartData(this.period);
    this.getProfitChartData(this.period);
 
  }
 
  getData() {
    this.dataService.getAllData().subscribe((apiData) => {
      console.log('Api data:', apiData);
      this.apiData = apiData;
      this.processApiData(apiData); // Pass the fetched API data to the processing method
      this.updateCharts();
      this.extractDates(apiData);
      this.extractScreenLabels();
    });
  }
 
  extractScreenLabels() {
    // Extract screen labels from the data
    for (const entry of this.apiData) {
      for (const event of entry.userEvents) {
        for (const screenName of Object.keys(event)) {
          if (screenName.startsWith('screen') && !this.screenLabels.includes(screenName)) {
            this.screenLabels.push(screenName);
          }
        }
      }
    }
  }
 
  getScreenData(screenLabel: string, selectedDate: string, selectedUsername: string): any[] {
    const userData = this.apiData.find(data => data.userInfo[0].userName === selectedUsername);
    if (userData) {
      return userData.userEvents
        .filter(event => event.date === selectedDate && event[screenLabel])
        .map(event => event[screenLabel]);
    }
    return [];
  }
 
 
  extractDates(apiData: { userEvents: any[] }[]) {
    const dates: string[][] = apiData.map(entry => entry.userEvents.map(event => event.date));
    const flattenedDates: string[] = [].concat(...dates); // Flatten the array of arrays
    this.allDates = Array.from(new Set(flattenedDates));
    console.log('All dates:', this.allDates);
  }
 
  // onDateSelected(selectedDate: string) {
  //   console.log('Selected date:', selectedDate);
  //   this.selectedDate = selectedDate;
  //   this.getEventData(selectedDate);
  // }
 
  onDateSelected(selectedDate: string) {
    this.selectedDate = selectedDate; // Update selected date property
    this.selectedUserScreenData = this.getScreenDataForSelectedUserAndDate();
    // Retrieve screen data for the selected date and user
    // this.screen1Data = this.getScreenData('screen1', selectedDate);
    // this.screen2Data = this.getScreenData('screen2', selectedDate);
  }
 
  getScreenDataForSelectedUserAndDate(): any {
    if (this.selectedUsername && this.selectedDate) {
      const userData = this.apiData.find(data => data.userInfo[0].userName === this.selectedUsername);
      if (userData) {
        const event = userData.userEvents.find(event => event.date === this.selectedDate);
        return event ? { ...event.screen1, ...event.screen2 } : null;
      }
    }
    return null;
  }
 
 
  getEventData(selectedDate: string) {
    const eventData = this.apiData.filter((entry: any) => {
      return entry.userEvents.some((event: any) => event.date === selectedDate);
    });
 
    // Reset screen data
    this.screen1Data = {};
    this.screen2Data = {};
 
    // Extract screen data for the selected date
    eventData.forEach((entry: any) => {
      entry.userEvents.forEach((event: any) => {
        if (event.date === selectedDate) {
          this.screen1Data = { ...this.screen1Data, ...event.screen1 };
          this.screen2Data = { ...this.screen2Data, ...event.screen2 };
        }
      });
    });
  }
 
 
  processApiData(apiData: any[]) {
    // Implement processing of API data similar to the processJsonData method
 
    // For example, if you want to extract unique usernames:
    this.uniqueUsernames = Array.from(new Set(apiData.map((data) => data.userInfo[0].userName)));
    // this.selectedUsername = this.uniqueUsernames[0];
 
    // You can perform other data processing tasks here as needed
  }
 
  // processJsonData() {
  //   this.selectedScreenData = jsonData[0]?.userEvents[0]?.screen1;
  //   this.updateCharts();
  // }
 
  setPeriodAndGetChartData(value: string): void {
    if (this.period !== value) {
      this.period = value;
    }
 
    this.getOrdersChartData(value);
    this.getProfitChartData(value);
  }
 
  changeTab(selectedTab) {
    if (selectedTab.tabTitle === 'Profit') {
      this.profitChart.resizeChart();
    } else {
      this.ordersChart.resizeChart();
    }
  }
 
  getOrdersChartData(period: string) {
    this.ordersProfitChartService.getOrdersChartData(period)
      .pipe(takeWhile(() => this.alive))
      .subscribe(ordersChartData => {
        this.ordersChartData = ordersChartData;
        this.updateCharts();
      });
  }
 
  getProfitChartData(period: string) {
    this.ordersProfitChartService.getProfitChartData(period)
      .pipe(takeWhile(() => this.alive))
      .subscribe(profitChartData => {
        this.profitChartData = profitChartData;
      });
  }
 
  updateCharts() {
    const seriesData: Highcharts.SeriesLineOptions[] = [];
    const dates: string[] = [];
 
    // Filter the API data based on the selected username or show all users if 'all' is selected
    const filteredUserData = this.apiData.filter((data) => {
      return this.selectedUsername === 'all' || data.userInfo[0].userName === this.selectedUsername;
    });
 
    // Iterate over the filtered user data to collect unique dates
    filteredUserData.forEach((userData: any, index: number) => {
      const userEvents = userData.userEvents;
      userEvents.forEach((event: any) => {
        const eventDate = event.date;
        if (!dates.includes(eventDate)) {
          dates.push(eventDate);
        }
      });
    });
 
    // Iterate over the filtered user data to collect data points for each user
    filteredUserData.forEach((userData: any, index: number) => {
      const userEvents = userData.userEvents;
      const username = userData.userInfo[0].userName;
      const dataPoints: number[] = [];
 
      // Iterate over the unique dates and collect data points for each date
      dates.forEach((date) => {
        const eventData = userEvents.find((event: any) => event.date === date);
        dataPoints.push(eventData ? eventData.totalCount : 0);
      });
 
      // Push series data for each user
      seriesData.push({
        name: username,
        type: 'line',
        data: dataPoints,
       
      });
    });
 
    this.cdr.detectChanges();
 
    // Set up Highcharts options using the collected data
    const options: Highcharts.Options = {
      chart: {
        type: 'line',
        renderTo: 'container',
        backgroundColor: '#2F3E57',
      },
      title: {
        text: 'Total Counts',
        style: {
          color: '#000',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      },
      xAxis: {
        categories: dates,
        labels: {
          style: {
            color: '#ffffff', // Set labels color to white
          },
        },
      },
      yAxis: {
        gridLineWidth: 0, // Remove gridlines
        labels: {
          style: {
            color: '#ffffff', // Set labels color to white
          },
        },
      },
      series: seriesData,
    };
 
    // Render the chart using Highcharts
    Highcharts.chart(options);
}
 
 
 
  switchUser(userIndex: number) {
    if (userIndex >= 0 && userIndex < this.apiData.length) {
      this.selectedUserIndex = userIndex;
      this.updateCharts();
    }
  }
 
 
  // onUserSelected(selectedUsername: string) {
  //   console.log('User selected:', selectedUsername);
 
  //   const userData = this.apiData.find((data) => data.userInfo[0].userName === selectedUsername);
 
  //   if (userData) {
  //     const userEventToDisplay = userData.userEvents[0];
  //     this.selectedUserScreenData = userEventToDisplay?.screen1;
 
  //     console.log('Selected user screen data:', this.selectedUserScreenData); // Add this line for debugging
 
  //     // Update the card content based on the selected user's screen1 data
  //     this.updateScreenDataCard();
  //   } else {
  //     this.selectedUserScreenData = null;
  //   }
  //   this.calculateButtonTotalsForUser(selectedUsername, 1);
  // this.calculateButtonTotalsForUser(selectedUsername, 2);
  //   console.log(selectedUsername);
  //   this.cdr.detectChanges(); // Force change detection
  //   this.updateCharts();
  // }
 
  // onUserSelected(selectedUsername: string) {
  //   this.selectedUsername = selectedUsername;
  //   this.getData();
  //   this.calculateButtonTotalsForUser(selectedUsername, 1);
  //   this.calculateButtonTotalsForUser(selectedUsername, 2);
  //   this.cdr.detectChanges();
  //   this.updateCharts();
  // }
 
  extractUserEventDates() {
    if (!this.selectedUsername) {
      this.userEventDates = []; // Reset the dates array if no username is selected
      return;
    }
 
    const userData = this.apiData.find(data => data.userInfo[0].userName === this.selectedUsername);
    if (userData) {
      const dates: string[] = userData.userEvents.map(event => event.date);
      this.userEventDates = Array.from(new Set(dates));
    } else {
      this.userEventDates = [];
    }
  }
 
  onUserSelected(selectedUsername: string) {
    this.selectedUsername = selectedUsername;
    this.getData();
    this.calculateButtonTotalsForUser(selectedUsername, 1);
    this.calculateButtonTotalsForUser(selectedUsername, 2);
    this.cdr.detectChanges();
    this.updateCharts();
    this.selectedUserScreenData = this.getScreenDataForSelectedUserAndDate();
    this.extractUserEventDates();
    // Clear the previously selected user screen data
    this.selectedUserScreenData = null;
 
    // Find the user data based on the selected username
    const userData = this.apiData.find((data) => data.userInfo[0].userName === selectedUsername);
 
    // If user data is found, find the user events for the selected date
    if (userData) {
      const selectedDateEvents = userData.userEvents.filter(event => event.date === this.selectedDate);
 
      // If events are found for the selected date, update the selected user screen data
      if (selectedDateEvents.length > 0) {
        this.selectedUserScreenData = selectedDateEvents[0];
      }
    }
  }
  // onDateSelected(selectedDate: string) {
  //   this.selectedDate = selectedDate; // Update selected date property
  //   this.getData(); // Fetch data for the selected date
  // }
 
  updateScreenDataCard() {
    this.buttonCounts = [];
 
    if (this.screen1Data) {
      Object.keys(this.screen1Data).forEach((property) => {
        this.buttonCounts.push({
          label: property,
          total: this.screen1Data[property],
        });
      });
    }
 
    if (this.screen2Data) {
      Object.keys(this.screen2Data).forEach((property) => {
        this.buttonCounts.push({
          label: property,
          total: this.screen2Data[property],
        });
      });
    }
 
    console.log('Button counts:', this.buttonCounts);
  }
 
 
 
 
 
 
 
  // updateScreenDataCard() {
  //   // Initialize an array to store the counts for each button in screen1
  //   this.buttonCounts = [];
 
  //   // Check if selectedUserScreenData is defined and contains screen1
  //   if (this.selectedUserScreenData?.screen1) {
  //     const screen1Data = this.selectedUserScreenData.screen1;
 
  //     // Iterate over the properties in screen1 and update the counts
  //     Object.keys(screen1Data).forEach((property) => {
  //       // Check if the property is a button in screen1
  //       const isButton = property.startsWith('btn_');
 
  //       if (isButton) {
  //         this.buttonCounts.push({
  //           label: property.replace(/_/g, ' '), // Replace underscores with spaces for better display
  //           total: screen1Data[property],
  //         });
  //       }
  //     });
 
  //     console.log('Button Counts:', this.buttonCounts);
 
  //   }
  // }
 
 
  calculateButtonTotalsForUser(selectedUsername: string, screenNumber: number) {
    const buttonTotals: { [key: string]: number } = {};
 
    const userData = this.apiData.find((data) => data.userInfo[0].userName === selectedUsername);
 
    if (userData) {
      const screenKey = `screen${screenNumber}`;
      for (const event of userData.userEvents) {
        if (event[screenKey]) {
          for (const property in event[screenKey]) {
            if (event[screenKey].hasOwnProperty(property)) {
              const isButtonOrLink = property.startsWith('btn_') || property.startsWith('link_');
              if (isButtonOrLink) {
                if (buttonTotals[property]) {
                  buttonTotals[property] += event[screenKey][property];
                } else {
                  buttonTotals[property] = event[screenKey][property];
                }
              }
            }
          }
        }
      }
 
      // Convert buttonTotals into an array of { label, total } objects
      const buttonTotalsArray = Object.keys(buttonTotals).map((label) => ({
        label: label.replace(/_/g, ' '),
        total: buttonTotals[label],
      }));
 
      console.log(`Button and Link Totals for ${selectedUsername} (Screen ${screenNumber}):`, buttonTotalsArray);
 
      if (screenNumber === 1) {
        this.selectedUserButtonTotalsScreen1 = buttonTotalsArray;
      } else if (screenNumber === 2) {
        this.selectedUserButtonTotalsScreen2 = buttonTotalsArray;
      }
    } else {
      console.error(`User not found: ${selectedUsername}`);
    }
  }
 
 
 
 
  ngOnDestroy() {
    this.alive = false;
  }
}